<?php

namespace App\Traits;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

trait FileUploadTrait
{

    public function handleFileUpload(Request $request, $fileAttribute, $directory)
{
    if ($request->hasFile($fileAttribute)) {

        // خزّني الملف
        $path = $request->file($fileAttribute)->store($directory, 'public');

        return [
            'path' => $path,
            'url'  => asset('storage/' . $path),
        ];
    }

    return null;
}



    // public function handleFileUpload(Request $request, $fileAttribute, $directory)
    // {
    //     if($request->hasFile($fileAttribute)){
    //         return $request->file($fileAttribute)->store($directory, 'public');
    //     }
    //     return null ;
    // }

}
